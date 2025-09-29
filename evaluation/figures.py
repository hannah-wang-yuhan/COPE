import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import argparse
import os

def create_boxplot_from_csv(csv_path, output_dir=None, figsize=(20, 12)):
    """
    从CSV文件生成箱线图，展示所有指标的最大值、最小值、中位数、上下四分位数
    
    Args:
        csv_path (str): 输入CSV文件路径
        output_dir (str): 输出目录，如果为None则使用CSV文件所在目录
        figsize (tuple): 图片尺寸 (width, height)
    """
    
    # 读取CSV文件
    try:
        df = pd.read_csv(csv_path)
        print(f"成功读取CSV文件: {csv_path}")
        print(f"数据形状: {df.shape}")
    except Exception as e:
        print(f"读取CSV文件失败: {e}")
        return
    
    # 获取数值列（排除id列）
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'id' in numeric_columns:
        numeric_columns.remove('id')
    
    print(f"找到 {len(numeric_columns)} 个数值指标")
    
    # 设置输出路径
    if output_dir is None:
        output_dir = os.path.dirname(csv_path)
    
    csv_filename = os.path.basename(csv_path)
    output_filename = f"{os.path.splitext(csv_filename)[0]}_boxplot.png"
    output_path = os.path.join(output_dir, output_filename)
    
    # 设置中文字体
    plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']  # 支持中文显示
    plt.rcParams['axes.unicode_minus'] = False  # 正常显示负号
    
    # 创建图形
    fig, ax = plt.subplots(figsize=figsize)
    
    # 准备数据 - 将所有数值列的数据整理为长格式
    plot_data = []
    for col in numeric_columns:
        for value in df[col].dropna():
            plot_data.append({'Metric': col, 'Value': value})
    
    plot_df = pd.DataFrame(plot_data)
    
    # 创建箱线图
    if len(numeric_columns) > 0:
        # 使用seaborn创建箱线图
        sns.boxplot(data=plot_df, x='Metric', y='Value', ax=ax)
        
        # 设置标题和标签
        ax.set_title('所有指标箱线图统计', fontsize=16, fontweight='bold', pad=20)
        ax.set_xlabel('指标名称', fontsize=12)
        ax.set_ylabel('数值', fontsize=12)
        
        # 旋转x轴标签以避免重叠
        ax.tick_params(axis='x', rotation=45, labelsize=10)
        ax.tick_params(axis='y', labelsize=10)
        
        # 添加网格
        ax.grid(True, alpha=0.3)
        
        # 调整布局
        plt.tight_layout()
        
        # 保存图片
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"箱线图已保存到: {output_path}")
        
        # 显示统计信息
        print("\n各指标统计信息:")
        print("-" * 50)
        for col in numeric_columns:
            stats = df[col].describe()
            print(f"{col}:")
            print(f"  最小值: {stats['min']:.4f}")
            print(f"  下四分位数: {stats['25%']:.4f}")
            print(f"  中位数: {stats['50%']:.4f}")
            print(f"  上四分位数: {stats['75%']:.4f}")
            print(f"  最大值: {stats['max']:.4f}")
            print(f"  均值: {stats['mean']:.4f}")
            print(f"  标准差: {stats['std']:.4f}")
            print()
        
    else:
        print("未找到数值列用于绘制箱线图")
    
    # 显示图片（如果在交互环境中）
    try:
        plt.show()
    except:
        pass

def generate_statistics_table(csv_path, output_dir=None):
    """
    生成统计信息数据表，包含每个指标的最大值、最小值、中位数、上下四分位数
    
    Args:
        csv_path (str): 输入CSV文件路径
        output_dir (str): 输出目录，如果为None则使用CSV文件所在目录
    """
    
    # 读取CSV文件
    try:
        df = pd.read_csv(csv_path)
        print(f"成功读取CSV文件: {csv_path}")
        print(f"数据形状: {df.shape}")
    except Exception as e:
        print(f"读取CSV文件失败: {e}")
        return
    
    # 获取数值列（排除id列）
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'id' in numeric_columns:
        numeric_columns.remove('id')
    
    print(f"找到 {len(numeric_columns)} 个数值指标")
    
    # 设置输出路径
    if output_dir is None:
        output_dir = os.path.dirname(csv_path)
    
    csv_filename = os.path.basename(csv_path)
    output_filename = f"{os.path.splitext(csv_filename)[0]}_statistics.csv"
    output_path = os.path.join(output_dir, output_filename)
    
    # 计算统计信息
    statistics_data = []
    
    for col in numeric_columns:
        stats = df[col].describe()
        statistics_data.append({
            '指标名称': col,
            '最小值': round(stats['min'], 4),
            '下四分位数(25%)': round(stats['25%'], 4),
            '中位数(50%)': round(stats['50%'], 4),
            '上四分位数(75%)': round(stats['75%'], 4),
            '最大值': round(stats['max'], 4),
            '均值': round(stats['mean'], 4),
            '标准差': round(stats['std'], 4),
            '有效样本数': int(stats['count'])
        })
    
    # 创建DataFrame并保存
    stats_df = pd.DataFrame(statistics_data)
    stats_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    
    print(f"统计信息表已保存到: {output_path}")
    
    # 显示统计信息
    print("\n各指标统计信息:")
    print("=" * 80)
    print(f"{'指标名称':<20} {'最小值':<10} {'下四分位数':<12} {'中位数':<10} {'上四分位数':<12} {'最大值':<10} {'均值':<10} {'标准差':<10}")
    print("-" * 80)
    
    for row in statistics_data:
        print(f"{row['指标名称']:<20} {row['最小值']:<10} {row['下四分位数(25%)']:<12} {row['中位数(50%)']:<10} {row['上四分位数(75%)']:<12} {row['最大值']:<10} {row['均值']:<10} {row['标准差']:<10}")
    
    return stats_df

def create_multiple_boxplots(csv_path, output_dir=None, figsize=(15, 10)):
    """
    为每个指标创建单独的箱线图
    
    Args:
        csv_path (str): 输入CSV文件路径
        output_dir (str): 输出目录
        figsize (tuple): 单个图片尺寸
    """
    
    # 读取CSV文件
    try:
        df = pd.read_csv(csv_path)
        print(f"成功读取CSV文件: {csv_path}")
    except Exception as e:
        print(f"读取CSV文件失败: {e}")
        return
    
    # 获取数值列（排除id列）
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'id' in numeric_columns:
        numeric_columns.remove('id')
    
    # 设置输出路径
    if output_dir is None:
        output_dir = os.path.dirname(csv_path)
    
    csv_filename = os.path.basename(csv_path)
    
    # 设置中文字体
    plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False
    
    # 为每个指标创建单独的箱线图
    for col in numeric_columns:
        fig, ax = plt.subplots(figsize=figsize)
        
        # 创建箱线图
        sns.boxplot(y=df[col].dropna(), ax=ax)
        
        # 设置标题和标签
        ax.set_title(f'{col} 箱线图', fontsize=14, fontweight='bold')
        ax.set_ylabel('数值', fontsize=12)
        
        # 添加统计信息到图上
        stats = df[col].describe()
        stats_text = f"""统计信息:
最小值: {stats['min']:.4f}
下四分位数: {stats['25%']:.4f}
中位数: {stats['50%']:.4f}
上四分位数: {stats['75%']:.4f}
最大值: {stats['max']:.4f}
均值: {stats['mean']:.4f}"""
        
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=10,
                verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        
        # 添加网格
        ax.grid(True, alpha=0.3)
        
        # 保存图片
        output_filename = f"{os.path.splitext(csv_filename)[0]}_{col}_boxplot.png"
        output_path = os.path.join(output_dir, output_filename)
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"已保存: {output_path}")
        
        plt.close()  # 关闭图形以释放内存

def main():
    """主函数，支持命令行参数"""
    parser = argparse.ArgumentParser(description='从CSV文件生成箱线图和统计表')
    parser.add_argument('csv_path', help='输入CSV文件路径')
    parser.add_argument('--output_dir', '-o', help='输出目录（可选）')
    parser.add_argument('--separate', '-s', action='store_true', help='为每个指标创建单独的箱线图')
    parser.add_argument('--table', '-t', action='store_true', help='生成统计信息数据表')
    parser.add_argument('--figsize', nargs=2, type=int, default=[20, 12], 
                       metavar=('WIDTH', 'HEIGHT'), help='图片尺寸（默认: 20 12）')
    
    args = parser.parse_args()
    
    # 生成统计信息表
    if args.table:
        print("生成统计信息数据表...")
        generate_statistics_table(args.csv_path, args.output_dir)
    
    # 生成箱线图
    if args.separate:
        print("为每个指标创建单独的箱线图...")
        create_multiple_boxplots(args.csv_path, args.output_dir, tuple(args.figsize))
    else:
        print("创建综合箱线图...")
        create_boxplot_from_csv(args.csv_path, args.output_dir, tuple(args.figsize))

if __name__ == "__main__":
    # 如果没有命令行参数，使用默认CSV文件
    import sys
    if len(sys.argv) == 1:
        # 默认处理optimal2_result.csv
        default_csv = "C:/Users/Administrator/Desktop/cope/COPE/evaluation/results/baseline_result.csv"
        if os.path.exists(default_csv):
            print("使用默认CSV文件...")
            print("生成统计信息数据表...")
            generate_statistics_table(default_csv)
            print("\n创建综合箱线图...")
            create_boxplot_from_csv(default_csv)
        else:
            print("默认CSV文件不存在，请提供CSV文件路径")
            print("使用方法: python figures.py <csv_path> [--output_dir <dir>] [--separate] [--table]")
    else:
        main()
